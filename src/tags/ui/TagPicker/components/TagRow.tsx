import React from 'react'
import styled from 'styled-components'
import { Tag } from 'src/tags/background/types'
import { TagResultItem } from 'src/tags/ui/TagPicker/components/TagResultItem'

interface TagRowItemEvents {
    onPress: (tag: Tag) => void
}
type Props = Tag & TagRowItemEvents & {}

class TagRow extends React.PureComponent<Props> {
    handleTagPress = () => {
        const { url, name } = this.props
        this.props.onPress && this.props.onPress({ url, name })
    }

    render() {
        const { name } = this.props

        return (
            <Row onClick={this.handleTagPress}>
                <TagResultItem>{name}</TagResultItem>
            </Row>
        )
    }
}

const Row = styled.div`
    border-bottom: 1px solid #e2e2ea;
    padding: 4px 8px;
    display: flex;
    justify-content: space-between;
    transition: background 0.3s;
    &:hover {
        background: #f7f7f9;
        cursor: pointer;
    }
`

export default styled(TagRow)``